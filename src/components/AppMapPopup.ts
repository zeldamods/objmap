import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

export interface AppMapPopupProps {
  title?: string;
  text?: string;
  pathLength?: number;
}

@Component
export default class AppMapPopup extends Vue {
  @Prop(String)
  private title!: string;

  @Prop(String)
  private text!: string;

  @Prop(Number)
  private pathLength!: number;

  private currentTitle = this.title;
  private currentText = this.text;

  @Watch('currentTitle')
  onTitleChanged(val: string) {
    this.$emit('title', val);
  }

  @Watch('currentText')
  onTextChanged(val: string) {
    this.$emit('text', val);
  }
}
